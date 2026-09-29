# Meridian Hill Park / Malcolm X Park — an architectural exhibition

A first-person 3D exhibition built with Three.js. The visitor walks through twelve connected rooms in a white concrete building. Each room covers one part of the history, use, politics and infrastructure of Meridian Hill Park, known in the community as Malcolm X Park, in Washington, DC.

The architecture is pristine. The history is not.

## Run it

The site is static but must be served over HTTP, because it loads JSON research files and ES modules.

```sh
cd berzerk
python3 -m http.server 8000
# open http://localhost:8000
```

Three.js 0.160 loads from the jsDelivr CDN through an import map. Fonts load from Google Fonts. There is no build step.

## Controls

| Input | Action |
| --- | --- |
| W A S D or arrow keys | Walk. Left and right arrows turn. |
| Mouse | Look (pointer lock) |
| Click, E or Enter | Open the object under the crosshair, or pass through a door |
| Shift | Walk faster |
| M | Floor plan. Click a room to travel there. |
| P | Archive of every claim and its provenance |
| T | Text version of the whole exhibition |
| N | Toggle the drum sound near room 08 |
| Esc | Close a panel and release the mouse |

On touch devices, drag on the lower left to walk, drag elsewhere to look, and tap objects. Without WebGL 2 the site opens the text version automatically.

## The rooms

| No. | Room | Spatial idea |
| --- | --- | --- |
| 01 | Entrance | Tall hall. A brass meridian line runs north through the building. |
| 02 | The Park Now | Rotunda with an oculus, a helical gallery band, and a schematic model of the terraces |
| 03 | Who Built This Place? | Rising ramp with an embedded timeline and a deliberately blank wall for unnamed labourers |
| 04 | The Neighborhood | Map set into the floor. Ten Data.gov datasets stand as monoliths whose height encodes year modified. |
| 05 | The Park as a Border | Room split by a wall with one slot. 36 slabs stand for the NPS units in DC, with a gap. 99 blocks stand for Rock Creek's small sites. |
| 06 | Malcolm X Park | The two names face each other across the room at equal size |
| 07 | Sunday | Brightest room, with abstract floor marks for soccer, yoga, dancing, picnics and dogs |
| 08 | The Drum Circle | Circular room with rings for Documented, Reported and Interpretation |
| 09 | Material / Infrastructure | Aggregate panel, cascade section, 27.4 m (90 ft) of pipe, statues, one empty plinth |
| 10 | 1968 | Low, narrow, dark corridor |
| 11 | Restoration | Running 13-basin cascade model and a restoration timeline through 2026 |
| 12 | Exit / Archive | Shelves, a reading table, methodology, gaps, and a portal back to the entrance |

## Research and provenance

All factual content lives in [research/provenance.json](research/provenance.json). Each claim records its source, organization, title, URL, MCP server, MCP tool, current or historical status, access date, confidence and qualification. Curatorial interpretation is kept in [js/content.js](js/content.js) and is labelled as interpretation in the interface.

- [research/nps_mcp_snapshot.json](research/nps_mcp_snapshot.json) is a trimmed, dated record of what the National Parks MCP returned.
- [research/datagov_datasets.json](research/datagov_datasets.json) holds metadata for the ten datasets shown in room 04.

### What the MCP servers returned (29 September 2026)

**National Parks MCP.** The server was called eight times, using findParks, getParkDetails, getAlerts and getEvents.
- Meridian Hill Park is not a standalone NPS unit. None of the 36 DC units is Meridian Hill.
- The park is represented through Rock Creek Park (rocr), which "also administers 99 separate neighborhood small sites."
- The only Meridian Hill record is a Rock Creek Park event for 17 October 2026. It calls the site "colloquially referred to as Malcolm X Park" and a "First Amendment space."
- No current alert names the park.

The exhibition keeps this distinction throughout.

**Data.gov MCP.** All four tools returned HTTP 404: package_search, package_show, group_list and tag_list. The legacy CKAN API they call also returns 404 directly. Dataset records were therefore retrieved from Data.gov's current public search endpoint, catalog.data.gov/search, by direct request. They are labelled as non-MCP in the provenance file. The datasets were located, not analysed, and no statistics are derived from them.

**Web research.** The MCP tools could not supply the park's history. Historical claims were checked against NPS web pages, the Cultural Landscape Foundation, and journalism. Claims seen only through search summaries are marked low confidence. Known gaps are listed in the provenance file and shown in room 12.

## API key security

- The NPS API key is used only inside the local MCP server configuration on the development machine.
- It does not appear in any file in this project: source, HTML, CSS, JSON, README or config.
- The site never calls the NPS API or Data.gov at runtime. It reads only the static, dated snapshots in `research/`.
- `.gitignore` excludes `.env*` files and local MCP configuration files as a precaution.

## Structure

```
index.html            page shell, overlays, import map
css/style.css         interface styles
js/main.js            renderer, first-person controls, interaction, transitions, audio, touch
js/world.js           architecture, floor heights, ramps, collision
js/exhibits.js        installations placed in each room
js/content.js         rooms, doors, exhibit text and claim references
js/textures.js        procedural concrete, limestone, aggregate, and architectural text
js/ui.js              panels, archive, plan, text version
research/             provenance and MCP snapshots
```

## Limits

- Drawings and models are schematic and not to scale. No archival photographs are reproduced.
- Neighborhood placements on the floor map are approximate, and no boundaries are drawn.
- Content is a snapshot as of 29 September 2026. The park's 2026 closure and restoration were ongoing at that date.
