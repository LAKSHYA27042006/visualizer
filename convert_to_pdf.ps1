$docxPath = "C:\Users\Ajitesh Mohan\Downloads\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.docx"
$pdfPath1 = "C:\Users\Ajitesh Mohan\Downloads\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.pdf"
$pdfPath2 = "C:\Users\Ajitesh Mohan\.gemini\antigravity\scratch\process-management-visualizer\PROCESS-MANAGEMENT-AND-FORK-TREE-VISUALIZER-REPORT.pdf"

$word = New-Object -ComObject 'Word.Application'
$word.Visible = $false
try {
    $doc = $word.Documents.Open($docxPath)
    $wdFormatPDF = 17
    $doc.SaveAs([ref]$pdfPath1, [ref]$wdFormatPDF)
    $doc.SaveAs([ref]$pdfPath2, [ref]$wdFormatPDF)
    $doc.Close()
    Write-Host "PDF Conversion Succeeded!"
} catch {
    Write-Error $_
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
