# Original images — untouched backups

Full-resolution originals of every photo used on the site, kept exactly as
supplied. The versions served to visitors live in `site/img/` and are WebP
conversions of these files (same pixel dimensions, ~90% smaller).

This folder sits OUTSIDE `site/`, so it is version-controlled and backed up
but never deployed to the website — visitors never download these.

To restore an original, copy it back into `site/img/` and update the matching
`src="..."` in the HTML to point at the .png / .jpg filename.
