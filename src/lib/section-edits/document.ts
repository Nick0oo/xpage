import {
  parseFragment,
  serialize,
  serializeOuter,
  type DefaultTreeAdapterTypes,
} from "parse5";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

type Element = DefaultTreeAdapterTypes.Element;
type Parent = DefaultTreeAdapterTypes.ParentNode;
type Node = DefaultTreeAdapterTypes.Node;

function isElement(node: Node): node is Element {
  return "tagName" in node;
}

function attribute(element: Element, name: string) {
  return element.attrs.find((item) => item.name === name)?.value;
}

function descendants(parent: Parent): Element[] {
  const result: Element[] = [];
  for (const node of parent.childNodes) {
    if (!isElement(node)) continue;
    result.push(node, ...descendants(node));
    if (node.tagName === "template") result.push(...descendants(node.content));
  }
  return result;
}

function textContent(node: Node): string {
  if (node.nodeName === "#text") return node.value;
  if (!isElement(node)) return "";
  const content = node.tagName === "template" ? node.content : node;
  return content.childNodes.map(textContent).join("");
}

function sectionNodes(html: string) {
  const fragment = parseFragment(html);
  return descendants(fragment).filter((element) => attribute(element, "data-xpage-section") !== undefined);
}

function markerValues(parent: Parent, name: string) {
  return descendants(parent)
    .map((element) => attribute(element, name))
    .filter((value): value is string => value !== undefined)
    .sort();
}

function serializeChildren(element: Element) {
  return element.childNodes.map((node) => serializeOuter(node)).join("");
}

export function getEditableSections(html: string) {
  const marked = sectionNodes(html);
  const ids = marked.map((element) => attribute(element, "data-xpage-section")!);
  const duplicates = new Set(ids.filter((id, index) => ids.indexOf(id) !== index));
  return marked.map((element) => {
    const id = attribute(element, "data-xpage-section")!;
    const heading = descendants(element).find((node) => /^h[1-6]$/.test(node.tagName));
    const title = heading ? textContent(heading).replace(/\s+/g, " ").trim() : "";
    return {
      id,
      title: title.slice(0, 140) || id.replaceAll("-", " "),
      editable: element.tagName === "section" && !duplicates.has(id),
      reason: element.tagName !== "section" ? "El marcador no está en un elemento <section>." : duplicates.has(id) ? "Este ID aparece más de una vez." : undefined,
    };
  });
}

export function extractSection(html: string, sectionId: string) {
  const fragment = parseFragment(html);
  const matches = descendants(fragment).filter((element) => attribute(element, "data-xpage-section") === sectionId);
  if (matches.length !== 1 || matches[0].tagName !== "section") {
    throw new Error("Esta landing no tiene un marcador de sección único y válido; la edición puntual está deshabilitada.");
  }
  const section = matches[0];
  return {
    section,
    html: serializeOuter(section),
    innerHtml: serializeChildren(section),
    slotIds: markerValues(section, "data-xpage-slot"),
    mediaMarkup: descendants(section)
      .filter((element) => ["img", "video", "source"].includes(element.tagName))
      .map((element) => serializeOuter(element)),
  };
}

function validateSectionFragment(html: string, sectionId: string, originalSlotIds: string[], originalMedia: string[]) {
  const fragment = parseFragment(html);
  const forbiddenTags = new Set(["script", "style", "iframe", "object", "embed", "base", "meta", "link"]);
  for (const element of descendants(fragment)) {
    if (forbiddenTags.has(element.tagName)) throw new Error("La propuesta incluye una etiqueta no permitida en la sección.");
    if (element.attrs.some((item) => /^on/i.test(item.name))) throw new Error("La propuesta incluye un manejador de evento HTML.");
    if (attribute(element, "data-xpage-section") !== undefined) throw new Error("La propuesta no debe crear ni cambiar marcadores de sección.");
  }
  const nextSlots = markerValues(fragment, "data-xpage-slot");
  if (JSON.stringify(nextSlots) !== JSON.stringify(originalSlotIds)) {
    throw new Error("La propuesta cambió los espacios de medios de la sección.");
  }
  const nextMedia = descendants(fragment)
    .filter((element) => ["img", "video", "source"].includes(element.tagName))
    .map((element) => serializeOuter(element));
  if (JSON.stringify(nextMedia) !== JSON.stringify(originalMedia)) {
    throw new Error("La propuesta alteró un medio existente. Los activos se conservan sin cambios.");
  }
  if (!sectionId) throw new Error("Falta el identificador de sección.");
  return fragment;
}

export function applySectionFragment(html: string, sectionId: string, replacement: string, originalSlotIds: string[], originalMedia: string[]) {
  const fragment = parseFragment(html);
  const matches = descendants(fragment).filter((element) => attribute(element, "data-xpage-section") === sectionId);
  if (matches.length !== 1 || matches[0].tagName !== "section") {
    throw new Error("El HTML cambió y ya no contiene una sección única para esta propuesta.");
  }
  const target = matches[0];
  const nextFragment = validateSectionFragment(replacement, sectionId, originalSlotIds, originalMedia);
  target.childNodes = nextFragment.childNodes;
  for (const child of target.childNodes) child.parentNode = target;
  return serialize(fragment);
}

export function validateScopedCss(css: string, sectionId: string) {
  const root = postcss.parse(css);
  const allowedAtRules = new Set(["media", "supports", "container"]);
  const validateContainer = (container: postcss.Container) => {
    for (const node of container.nodes ?? []) {
      if (node.type === "atrule") {
        if (!allowedAtRules.has(node.name.toLowerCase()) || !node.nodes) {
          throw new Error("El CSS de la propuesta contiene una regla global no permitida.");
        }
        validateContainer(node);
        continue;
      }
      if (node.type === "rule") {
        const selectorList = selectorParser().astSync(node.selector);
        selectorList.each((selector) => {
          const first = selector.nodes.find((part) => part.type !== "comment");
          if (first?.type !== "attribute" || first.attribute !== "data-xpage-section" || first.operator !== "=" || first.value !== sectionId) {
            throw new Error("Cada selector CSS debe comenzar con el marcador de la sección editada.");
          }
        });
        node.walkDecls((declaration) => {
          if (/url\s*\(|expression\s*\(/i.test(declaration.value)) {
            throw new Error("El CSS de la propuesta no puede cargar recursos ni ejecutar expresiones.");
          }
        });
        continue;
      }
      if (node.type === "decl") throw new Error("El CSS de la propuesta no puede declarar estilos globales.");
    }
  };
  validateContainer(root);
  return root.toString().trim();
}

export function relevantCss(css: string, sectionId: string, sectionHtml: string) {
  const fragment = parseFragment(sectionHtml);
  const elements = descendants(fragment);
  const classes = new Set(elements.flatMap((element) => (attribute(element, "class") ?? "").split(/\s+/).filter(Boolean)));
  const ids = new Set(elements.map((element) => attribute(element, "id")).filter((value): value is string => Boolean(value)));
  const tags = new Set(elements.map((element) => element.tagName));
  const root = postcss.parse(css);
  const selected: string[] = [];
  root.walkRules((rule) => {
    const list = selectorParser().astSync(rule.selector);
    let relevant = false;
    list.each((selector) => selector.walk((part) => {
      if (part.type === "attribute" && part.attribute === "data-xpage-section" && part.value === sectionId) relevant = true;
      if (part.type === "class" && classes.has(part.value)) relevant = true;
      if (part.type === "id" && ids.has(part.value)) relevant = true;
      if (part.type === "tag" && tags.has(part.value.toLowerCase())) relevant = true;
    }));
    if (relevant) selected.push(rule.toString());
  });
  return selected.join("\n").slice(0, 24_000);
}

export function getSectionCode(html: string, sectionId: string, replacement?: string) {
  const target = extractSection(html, sectionId);
  if (replacement === undefined) return target.html;
  const fragment = validateSectionFragment(replacement, sectionId, target.slotIds, target.mediaMarkup);
  const { section } = target;
  section.childNodes = fragment.childNodes;
  for (const child of section.childNodes) child.parentNode = section;
  return serializeOuter(section);
}
