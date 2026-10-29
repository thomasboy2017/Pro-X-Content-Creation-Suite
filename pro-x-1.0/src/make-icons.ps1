Add-Type -AssemblyName System.Drawing

$dir = "C:\Users\matth\OneDrive\Documents\Default Project\pro-x-1.0"
$enc = New-Object System.Text.UTF8Encoding($false)

function New-RoundRect([System.Drawing.RectangleF]$r, [single]$rad) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $rad * 2
  $p.AddArc($r.X, $r.Y, $d, $d, 180, 90)
  $p.AddArc($r.Right - $d, $r.Y, $d, $d, 270, 90)
  $p.AddArc($r.Right - $d, $r.Bottom - $d, $d, $d, 0, 90)
  $p.AddArc($r.X, $r.Bottom - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-Icon([int]$size, [string]$name, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::Transparent)

  $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
  $c1 = [System.Drawing.Color]::FromArgb(255, 27, 111, 224)
  $c2 = [System.Drawing.Color]::FromArgb(255, 111, 91, 255)
  $c3 = [System.Drawing.Color]::FromArgb(255, 33, 201, 165)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c3, 45.0
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend 3
  $blend.Colors = @($c1, $c2, $c3)
  $blend.Positions = @(0.0, 0.55, 1.0)
  $brush.InterpolationColors = $blend

  if ($maskable) {
    $g.FillRectangle($brush, $rect)
  } else {
    $pad = [single]($size * 0.06)
    $rr = New-RoundRect (New-Object System.Drawing.RectangleF $pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad)) ([single]($size * 0.2))
    $g.FillPath($brush, $rr)
    $rr.Dispose()
    # inner highlight
    $hl = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(26, 255, 255, 255))
    $hr = New-RoundRect (New-Object System.Drawing.RectangleF ($size * 0.12), ($size * 0.12), ($size * 0.76), ($size * 0.76)) ([single]($size * 0.16))
    $g.FillPath($hl, $hr)
    $hr.Dispose(); $hl.Dispose()
  }

  # Play triangle
  $cx = $size / 2; $cy = $size / 2
  $s = if ($maskable) { $size * 0.30 } else { $size * 0.32 }
  $pts = @(
    (New-Object System.Drawing.PointF (($cx - $s * 0.42)), ($cy - $s * 0.62)),
    (New-Object System.Drawing.PointF (($cx + $s * 0.68)), ($cy)),
    (New-Object System.Drawing.PointF (($cx - $s * 0.42)), ($cy + $s * 0.62))
  )
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $g.FillPolygon($white, $pts)

  # Accent dot
  $dot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
  $ds = [single]($size * 0.045)
  $g.FillEllipse($dot, [single]($size * 0.735 - $ds), [single]($size * 0.265 - $ds), $ds * 2, $ds * 2)

  $white.Dispose(); $dot.Dispose(); $brush.Dispose(); $g.Dispose()
  $path = Join-Path $dir $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "$name $size"
}

New-Icon 32 "icon-32.png" $false
New-Icon 180 "icon-180.png" $false
New-Icon 192 "icon-192.png" $false
New-Icon 512 "icon-512.png" $false
New-Icon 512 "icon-maskable-512.png" $true
