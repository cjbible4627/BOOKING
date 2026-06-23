# PreCompact hook: Export conversation to .docx
# Called automatically before each context compaction.
# Receives JSON on stdin: { "session_id": "...", "hook_event_name": "PreCompact" }

$inputData = [Console]::In.ReadToEnd()
try   { $json = $inputData | ConvertFrom-Json; $sessionId = $json.session_id }
catch { $sessionId = "unknown" }

$baseDir  = "C:\Users\user\Desktop\AI " + [char]0xC601 + [char]0xC12D + " " + [char]0xC791 + [char]0xC5C5 + [char]0xAE30 + [char]0xB85D + "\desktop wrok\BOOKING"
$docsDir  = Join-Path $baseDir "docs"
$ts       = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile  = Join-Path $docsDir "chat_$ts.docx"

$transcriptDir  = "C:\Users\user\.claude\projects\C--Users-user-Desktop-AI---------desktop-wrok-BOOKING"
$transcriptFile = Join-Path $transcriptDir "$sessionId.jsonl"

# --- Build text lines ---------------------------------------------------
$lines = New-Object System.Collections.Generic.List[string]
$title = [System.Text.Encoding]::UTF8.GetString([byte[]](
    0xEC,0xB2,0xAD,0xEB,0x85,0x84,0xEC,0x84,0xB1,0xEC,0x84,0x9C,0xEB,0xAA,0xA8,0xEC,0x9E,0x84,0x20,
    0xEA,0xB3,0xB5,0xAD,0x20,0xEC,0x98,0x88,0xEC,0x95,0xBD,0x20,0xEC,0x8B,0x9C,0xEC,0x8A,0xA4,
    0xED,0x85,0x9C,0x20,0xEB,0x8C,0x80,0xED,0x99,0x94))
$lines.Add($title)
$lines.Add("Saved : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$lines.Add("Session: $sessionId")
$lines.Add("")
$lines.Add(("=" * 60))
$lines.Add("")

if (Test-Path $transcriptFile) {
    $raw = Get-Content -Path $transcriptFile -Encoding UTF8
    foreach ($ln in $raw) {
        if (-not $ln) { continue }
        try {
            $entry = $ln | ConvertFrom-Json
            if ($entry.type -eq "user") {
                $lines.Add("[User]")
            } elseif ($entry.type -eq "assistant") {
                $lines.Add("[Claude]")
            } else {
                continue
            }
            $mc = $entry.message.content
            if ($mc -is [string]) {
                $lines.Add($mc)
            } elseif ($mc -is [array]) {
                foreach ($blk in $mc) {
                    if ($blk.type -eq "text") { $lines.Add($blk.text) }
                }
            }
            $lines.Add("")
            $lines.Add(("-" * 40))
            $lines.Add("")
        } catch { }
    }
} else {
    $lines.Add("Transcript not found: $transcriptFile")
}

# --- Build .docx (Open XML = ZIP of XML files) --------------------------
$tmp  = Join-Path $env:TEMP "docx_$ts"
$null = New-Item -ItemType Directory -Force -Path $tmp
$null = New-Item -ItemType Directory -Force -Path "$tmp\_rels"
$null = New-Item -ItemType Directory -Force -Path "$tmp\word"
$null = New-Item -ItemType Directory -Force -Path "$tmp\word\_rels"

$ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'

$rr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'

$wr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'

$sb = New-Object System.Text.StringBuilder
foreach ($ln in $lines) {
    $esc = $ln -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'
    $null = $sb.Append("<w:p><w:r><w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
}

$docXml  = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
$docXml += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
$docXml += "<w:body>$($sb.ToString())<w:sectPr/></w:body></w:document>"

$utf8nb = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$tmp\[Content_Types].xml",       $ct,     $utf8nb)
[System.IO.File]::WriteAllText("$tmp\_rels\.rels",               $rr,     $utf8nb)
[System.IO.File]::WriteAllText("$tmp\word\document.xml",         $docXml, $utf8nb)
[System.IO.File]::WriteAllText("$tmp\word\_rels\document.xml.rels", $wr,  $utf8nb)

Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $outFile) { Remove-Item $outFile -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $outFile)
[System.IO.Directory]::Delete($tmp, $true)

Write-Host "Saved: $outFile"
