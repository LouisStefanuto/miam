from pathlib import Path

import mkdocs_gen_files

PACKAGE_NAME = "miam"
SRC_ROOT = Path("../backend/src/miam")
N = len(SRC_ROOT.parts)

nav = mkdocs_gen_files.Nav()

for path in sorted(SRC_ROOT.rglob("*.py")):
    rel = path.relative_to(SRC_ROOT).with_suffix("")
    parts = tuple(rel.parts)

    # Root package (__init__.py)
    if parts == ("__init__",):
        nav_parts = ()
        identifier = PACKAGE_NAME
        doc_path = Path("reference/index.md")

    # Subpackage __init__.py
    elif parts[-1] == "__init__":
        nav_parts = parts[:-1]
        identifier = ".".join((PACKAGE_NAME, *nav_parts))
        doc_path = Path("reference", *nav_parts, "index.md")

    # Regular module
    else:
        nav_parts = parts
        identifier = ".".join((PACKAGE_NAME, *parts))
        doc_path = Path("reference", *parts).with_suffix(".md")

    nav[nav_parts] = doc_path.relative_to("reference").as_posix()

    with mkdocs_gen_files.open(doc_path, "w") as fd:
        fd.write(f"::: {identifier}\n")

    mkdocs_gen_files.set_edit_path(doc_path, Path("../src") / path)

# Write navigation
with mkdocs_gen_files.open("reference/SUMMARY.md", "w") as nav_file:
    nav_file.writelines(nav.build_literate_nav())
