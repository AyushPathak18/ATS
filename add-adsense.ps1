$adsense = '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4304122170615374" crossorigin="anonymous"></script>'

Get-ChildItem -Path "C:\Users\ayush\ATS" -Recurse -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -notmatch 'adsbygoogle') {
        $content = $content -replace '</head>', "$adsense`n</head>"
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($_.Name)"
    } else {
        Write-Host "Skipped (already has AdSense): $($_.Name)"
    }
}
Write-Host "`nDone! AdSense added to all pages."
