{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server

    # better-sqlite3 builds a native addon at install time. node-gyp uses
    # python3, make and a C++ toolchain. pkg-config is occasionally needed
    # when the addon links against system libsqlite3.
    pkgs.python3
    pkgs.gnumake
    pkgs.gcc
    pkgs.pkg-config

    # System sqlite — handy in the Replit shell for `sqlite3 data/aide.db`
    # ad-hoc queries during ops, and for `db:backup` / `db:restore`.
    pkgs.sqlite
  ];
}
