# Third-Party Notices

This application bundles the following third-party components whose licenses
require notice beyond standard MIT/Apache-2.0 attribution. This file exists to
satisfy those obligations for distributed builds (`npm run dist:mac` / `dist:win`).

## gifsicle (GPL-2.0-only)

The `gifsicle` npm package (server-side GIF optimization, invoked as a
subprocess from `server/utils/gifOptimizer.js`) bundles a compiled binary of
Eddie Kohler's LCDF Gifsicle, licensed under the **GNU General Public License,
Version 2 (only)**.

- Full license text: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
- Upstream project: https://github.com/kohler/gifsicle
- Source corresponding to the bundled binary: available from the upstream
  project's release tags matching the vendored version, or on request.

> **Action pending:** the gifsicle author's own README asks distributors to
> make contact before embedding the binary in a closed-source commercial
> product. This has not yet been done — see open item in project tracking.

## sharp / libvips and dependent libraries (LGPLv3)

`sharp` (Apache-2.0) dynamically links a prebuilt `libvips` shared library
(`@img/sharp-libvips-*`), which is licensed under the **GNU Lesser General
Public License, Version 3**, along with several statically-rolled-in
sub-libraries also under LGPLv3: fribidi, glib, libexif, libheif, librsvg,
pango, proxy-libintl.

- Full license text: https://www.gnu.org/licenses/lgpl-3.0.html
- Upstream project: https://github.com/libvips/libvips
- These libraries are linked dynamically (as separate `.dylib`/`.dll`/`.so`
  files, not statically fused into the application binary), which is the
  LGPL-compliant linking mode. Corresponding source for the exact bundled
  version is available from the upstream project's release matching the
  version pinned in `package-lock.json` (`@img/sharp-libvips-*`), or on
  request.

## Everything else

All other bundled dependencies are permissively licensed (MIT, Apache-2.0,
BSD, or dual-licensed with a permissive option selected) and require only
standard attribution, satisfied by their respective `LICENSE` files retained
under `node_modules/`.
