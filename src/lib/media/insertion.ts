export type MediaInsertion = {
  id: string;
  type: "image" | "video";
  sectionId: string;
  slotId: string;
  altText: string;
  author: string;
  creditUrl: string;
  providerLabel: string;
  providerUrl: string;
};

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function insertMediaIntoLanding(html: string, input: MediaInsertion) {
  const sectionPattern = new RegExp(`<section\\b[^>]*data-xpage-section=["']${input.sectionId}["'][^>]*>`, "i");
  const section = sectionPattern.exec(html);
  if (!section) throw new Error("La sección seleccionada no aparece en el HTML. Revisa el plan y vuelve a construir la landing.");
  const slotPattern = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*data-xpage-slot=["']${input.slotId}["'][^>]*>`, "ig");
  const allSections = [...html.matchAll(new RegExp(`<section\\b[^>]*data-xpage-section=["']${input.sectionId}["'][^>]*>`, "ig"))];
  const allSlots = [...html.matchAll(new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*data-xpage-slot=["']${input.slotId}["'][^>]*>`, "ig"))];
  if (allSections.length !== 1 || allSlots.length !== 1) throw new Error("La sección o el espacio no es único en el HTML. Vuelve a construir la landing antes de asignar medios.");
  slotPattern.lastIndex = section.index + section[0].length;
  const slot = slotPattern.exec(html);
  const closingSection = html.indexOf("</section>", section.index + section[0].length);
  if (!slot || (closingSection >= 0 && slot.index > closingSection)) throw new Error("El espacio de medios no pertenece a la sección elegida.");

  const blockStart = `<!--xpage-media-slot:${input.slotId}:start-->`;
  const blockEnd = `<!--xpage-media-slot:${input.slotId}:end-->`;
  const blockPattern = new RegExp(`${blockStart}[\\s\\S]*?${blockEnd}`, "g");
  const withoutExisting = html.replace(blockPattern, "");
  const alt = escapeAttribute(input.altText);
  const author = escapeAttribute(input.author);
  const creditUrl = escapeAttribute(input.creditUrl);
  const providerUrl = escapeAttribute(input.providerUrl);
  const figure = input.type === "image"
    ? `<figure style="margin:0"><img src="/api/media/assets/${input.id}" alt="${alt}" loading="lazy" style="display:block;max-width:100%;height:auto;object-fit:cover"><figcaption>${author ? `Photo by <a href="${creditUrl}" target="_blank" rel="noopener noreferrer">${author}</a> on ` : ""}<a href="${providerUrl}" target="_blank" rel="noopener noreferrer">${escapeAttribute(input.providerLabel)}</a></figcaption></figure>`
    : `<figure style="margin:0"><video controls playsinline preload="metadata" poster="/api/media/assets/${input.id}?poster=1" style="display:block;max-width:100%;height:auto"><source src="/api/media/assets/${input.id}" type="video/mp4">Tu navegador no puede reproducir este video.</video><figcaption>${author ? `Video by <a href="${creditUrl}" target="_blank" rel="noopener noreferrer">${author}</a> on ` : ""}<a href="${providerUrl}" target="_blank" rel="noopener noreferrer">${escapeAttribute(input.providerLabel)}</a></figcaption></figure>`;
  const marker = `${blockStart}${figure}${blockEnd}`;
  const refreshedSlot = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*data-xpage-slot=["']${input.slotId}["'][^>]*>`, "i").exec(withoutExisting);
  if (!refreshedSlot) throw new Error("No se pudo actualizar el espacio de medios.");
  const insertion = refreshedSlot.index + refreshedSlot[0].length;
  return `${withoutExisting.slice(0, insertion)}${marker}${withoutExisting.slice(insertion)}`;
}

export function removeMediaFromLanding(html: string, slotId: string) {
  const pattern = new RegExp(`<!--xpage-media-slot:${slotId}:start-->[\\s\\S]*?<!--xpage-media-slot:${slotId}:end-->`, "g");
  return html.replace(pattern, "");
}
