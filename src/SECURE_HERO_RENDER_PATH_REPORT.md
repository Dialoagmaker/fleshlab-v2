# Secure Hero Render Path Report

## Current blocked flow

Hero Frame → Browser Blob → Privacy Guard → Base44 function invoke approved → XMLHttpRequest body inspection → blocked → Hero Photography Engine cannot execute.

## Blocking component

`src/lib/aiMediaStudio/privacyGuard.js`

## Blocking rule

The lower-level `XMLHttpRequest.prototype.send` interception blocked any request body containing a nested `data:image/...` value. The higher-level `base44.functions.invoke("openRouterAICover", ...)` path had an image exception, but the XHR guard still classified the serialized JSON body as forbidden local media.

## Why it was classified as forbidden local media

The selected Hero Frame was encoded into a `data:image/...` string. The guard treated every image data URL the same as local media, without a dedicated consent-scoped distinction between an original video/blob and a selected derivative Hero Frame.

## Was the Hero Frame treated as an original video asset?

It was not typed as video, but it was handled by the same broad local-media block as forbidden browser media. The guard did not yet distinguish the selected Hero Frame derivative from original video assets.

## New approved rendering flow

Video → Local Analysis → Frame Selection → Selected Hero Frame → Creative Brain → Production Blueprint → User Consent → Hero Photography Engine → Rendering Provider → Hero Photograph.

## Files changed

- `src/lib/aiMediaStudio/privacyGuard.js`
- `src/pages/admin/CreativeBrain.jsx`
- `src/components/creativeBrain/HeroPhotographyPanel.jsx`
- `src/lib/heroPhotography/heroPhotographyEngine.js`
- `src/lib/heroPhotography/providers/openRouterHeroProvider.js`
- `src/SECURE_HERO_RENDER_PATH_REPORT.md`

## Security guarantees

- Privacy Guard remains active.
- Original videos remain blocked.
- Browser `File`, `Blob`, `ArrayBuffer`, `FormData` media entries, nested media payloads, and generic `data:image` / `data:video` payloads remain blocked.
- A Hero Frame can pass only through the explicit `approved_hero_frame_render` channel.
- The approved channel requires explicit user consent.
- The approved channel requires `selected_hero_frame_only: true`.
- The approved channel rejects additional frames, video data, timelines, frame blobs, hidden metadata, browser analysis data, and unrelated browser blobs.
- The render path sends one selected Hero Frame only, not a duplicate identity frame.

## Transmitted payload

- Selected Hero Frame as one image data URL.
- Current Production Blueprint.
- Provider-neutral rendering brief derived from the blueprint.
- Rendering parameters: 16:9 professional Hero Photograph request.
- Explicit privacy intent and user approval statement.

## Data never transmitted

- Original video file.
- Full video timeline.
- Video blobs.
- Local frame extraction payloads.
- Additional frames.
- Folder analysis data.
- Browser blobs unrelated to the selected Hero Frame.
- Hidden metadata.
- Cached video upload.
- Background synchronization payloads.

## Verification performed

- Provider audit passed: OpenRouter connected, credits available, compatible image generation route available.
- Provider self-test passed: one reference image was transmitted server-side, provider executed, one Hero Photograph was returned.
- Privacy Guard simulation passed: consent-approved selected Hero Frame payload passed through the approved channel.
- Privacy Guard simulation passed: payload containing `video_data_url` remained blocked.
- Privacy Guard simulation passed: image payload without the approved channel remained blocked.

## Remaining privacy limitations

- The selected Hero Frame is transmitted to the rendering provider only after approval.
- The current Production Blueprint is transmitted with the rendering request.
- Provider execution depends on the configured Rendering Intelligence provider and its policy/availability.
- The live browser flow must be manually confirmed in the preview by uploading a Hero Frame, generating a Blueprint, approving the consent prompt, and rendering.