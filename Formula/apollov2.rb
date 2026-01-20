class Apollov2 < Formula
  desc "AI-powered CLI for software development by Metamorphosis Labs"
  homepage "https://github.com/i-luv-pho/apollo-luma-4.7"
  version "1.0.12"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/i-luv-pho/apollo-luma-4.7/releases/download/v1.0.12/apollov2-darwin-arm64.zip"
      sha256 "49c8ec2d06393493d300ffd97e07675fbcdd788da492c10d63adea3febfdae21"
    else
      url "https://github.com/i-luv-pho/apollo-luma-4.7/releases/download/v1.0.12/apollov2-darwin-x64.zip"
      sha256 "3493188e0fc32faf1311caa979ff6298766c32371073cdd3b150a92ce5a02a6f"
    end
  end

  def install
    bin.install "apollov2"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/apollov2 --version", 2)
  end
end
