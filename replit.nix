{pkgs}: {
  deps = [
    pkgs.xvfb-run
    pkgs.chromium
    pkgs.ffmpeg
    pkgs.jq
    pkgs.bash
  ];
}
