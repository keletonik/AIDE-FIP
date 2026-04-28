{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript
    pkgs.nodePackages.typescript-language-server
    pkgs.python3
    pkgs.gnumake
    pkgs.gcc
    pkgs.sqlite
  ];
}
