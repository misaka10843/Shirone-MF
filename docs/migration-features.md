# Personal-site migration features

## Navigation and project presentation

The desktop navbar is centered and constrained by `--page-width`, with a minimum
viewport gutter. The mobile bar remains full width. Native disclosures support
mouse hover, click, touch, keyboard arrows and Escape. The glass filter lives on a
separate plane; the navbar intentionally does not use the opacity entrance animation,
which creates a backdrop root and prevents its dropdown from blurring the wallpaper.

Project cards follow Firefly's inset 2:1 cover, overlaid phase, compact metadata,
summary and bottom actions. MIT attribution is in `THIRD_PARTY_NOTICES.md`.
Set `details: true` on a project and supply `content/spec/projects/<key>.md` in the
content repository for its `/projects/<key>/` page. Both source and package routes
use the same spec schema and auto-discovered route.

## Friend applications

Set `showApplication: true` in the content repository's `config/friends.yaml`.
Supply `data/friendApplication.ts` exporting `friendApplication` (type
`FriendApplication` from `@/types/friendsConfig`). All identity fields, instructions,
templates and notes are authored content. The optional panel renders below the friend
list, has copy buttons and uses the existing comments provider. When disabled there
is no panel, comment block or panel stylesheet. In npm mode, override
`shirones/config/data/friendApplication.ts` instead.
Re-export `friendApplication` from the existing `data/friends.ts` module (in npm
mode, `shirones/config/data/friends.ts`). Existing sites that omit that export remain compatible.

## One game collection, two sources

`config/games.yaml`:

```yaml
enable: true
categories:
  - { key: collection, label: 游戏 }
  - { key: visual-novel, label: 视觉小说 }
remote:
  bangumi: { enable: true, userId: misaka10843 }
  vndb:
    enable: true
    matches: {} # Optional Bangumi subject ID → VNDB ID (v123) overrides
```

Run `pnpm.cmd games:sync`, then `pnpm.cmd content:sync`. The source-checkout helper
writes `data/game-snapshots/collection.json` and its generated `data/gameCollection.ts`
adapter into the external content repository. Commit both. Builds consume local
snapshots and never poll either API. In package mode the same adapter is an ordinary
data override in `shirones/config/data/`, importing the colocated snapshot.
Re-export `gameCollection` from the existing `data/games.ts` module:
`export { gameCollection } from "./gameCollection";`. Existing manual game modules
do not need that export unless snapshot sync is enabled.

Bangumi owns membership, playing/completed/wishlist/on-hold/dropped status and
personal scores (0–10 converted to the existing 0–5 display). VNDB supplies developer
metadata and source links to the **same card**, without requiring a VNDB account.
Automatic matches require a unique exact normalized title or alias; fuzzy matches,
ambiguous results and truncated searches are ignored. Explicit `matches` override
ambiguous titles. `games:sync --refresh-vndb` refreshes cached matches.

Requests time out after 15 seconds, reject oversized/non-JSON responses, and preserve
the last valid collection on failures. A partial VNDB outage still permits Bangumi
updates. Empty results do not erase an existing collection. No tokens are published.
Remote configuration is optional and disabled by default; manual `data/games.ts`
continues to work when the remote source is off.

API contracts: [Bangumi](https://bangumi.github.io/api/),
[VNDB Kana](https://api.vndb.org/kana). VNDB metadata remains attributed via each
card's source link; see the [VNDB data license](https://vndb.org/d17).

## About profile media and UID account cards

The `profile.sections` frontmatter in `content/spec/about.md` supports:

- `personality: { type: INFJ-T, gender: male }`: automatic 16Personalities avatar
  matching; `-A` and `-T` variants use the corresponding four-letter type artwork.
- `items[].logo`: an optional local or HTTPS team logo before each team. Failed
  images retain a local SVG fallback instead of showing a broken image.
- `musicLinks: [{ href: ... }]`: detects Spotify, QQ Music, Kugou, NetEase Cloud
  Music and Apple Music domains, providing the platform icon and name. Optional
  `label` and `logo` override presentation. No music player SDK is loaded.
- `kind: games`: renders the configured UID account cards as a responsive grid.

UID-only configuration belongs in `config/games.yaml`:

```yaml
profileAccounts:
  - { game: genshin, uid: "156136129" }
  - { game: starrail, uid: "100423516" }
  - { game: zzz, uid: "11686584" }
  - { game: endfield, uid: "1015932103" }
```

Run `pnpm.cmd profile-games:sync` and `pnpm.cmd content:sync`. Nicknames, levels,
public signatures, achievements and showcased-character counts are derived from
the provider responses, never authored as fake account data. The generated
`data/game-account-snapshots.json` is re-exported by `data/games.ts`:

```typescript
export { default as gameAccountSnapshot } from "./game-account-snapshots.json";
```

The public provider is [Enka.Network](https://enka.network/), with
[Genshin and ZZZ schemas](https://github.com/EnkaNetwork/API-docs). The Endfield
normalizer follows the live `playerInfo.businessCard` response. Refreshes respect
the returned TTL, time out after 15 seconds, enforce a 5 MB cap, and keep the last
successful snapshot on failure. Builds and page visits do not call the account API.
Changing a configured UID cannot expose another UID's cached profile.

Arknights, Blue Archive and NTE may retain UID-only cards; there is currently no
verified public UID-only adapter for them. A direct anonymous request to Skland's
Arknights player-info endpoint returned HTTP 401 / code 10002 (login required).
No login credentials are accepted in frontmatter or published snapshots.

Music links in the migrated personal profile initially lead to the five platform
homepages; replace them with personal playlists/profile links when desired.
The unused self-tags section was removed from that profile only.

## WebP preparation in the source-checkout build

Opt in with `image-optimization.json` at the external content repository root:

```json
{ "enable": true }
```

`pnpm.cmd build` syncs content, converts its images and syncs the rewritten references
before Astro builds. To prepare a content commit, run `pnpm.cmd content:images`, review
the **content repository's** diff and commit the converted files plus references.
The helper deliberately does not stage or commit unrelated user edits.

PNG and GIF use lossless WebP; JPEG/AVIF use quality 85. Animation frames/timing and
alpha are retained; screenshots stay lossless. SVG, ICO, existing WebP and files under
`favicon/` or `icons/` remain unchanged. Only `public/` and `assets/` raster files
are converted. Authored Markdown, YAML, TS, JSON and other text references are updated,
including encoded paths and query/fragment suffixes. External URLs stay unchanged.
Existing WebP targets are never overwritten. Original raster files are deleted only
after conversion validation and reference rewriting. The next build is a no-op.

The content repository's image conversion is a source-checkout preparation command;
npm consumers can run their own image preparation before supplying the public files.

## Article AI disclosure

Set the optional `ai` field in an article's frontmatter to show a badge on the article card and the model list on its detail page.

```yaml
ai:
  mode: assisted
  models:
    - provider: OpenAI
      name: GPT-5
    - provider: Anthropic
      name: Claude
```

Use `generated` for AI-generated articles and `assisted` for AI-assisted writing. Supply at least one model. Recognized providers use brand icons and other providers use a generic model icon.

## Toolbox and homepage extras

Set `homeActivity`, `randomExplore`, or `notFoundArt` in the content repository's `data/blog-extras.ts` to enable the homepage summary, random public-article links, or the 404 illustration. Put the illustration under the content repository's `public/images/`.

The toolbox at `/toolbox/` reads custom cards from `blogExtras.tools`. Each card has a `title` and `href`, with optional `description` and `tags`. Add the route to your navigation when configuring the toolbox.

Set `gistUser` and run the following from the theme repository to update the public Gist cards in the content repository.

```powershell
node scripts/sync-toolbox-gists.mjs misaka10843 ../blog-content/data/toolbox-gists.json
```

Commit the updated snapshot in the content repository to publish the changes. The site reads the saved cards at build time.
