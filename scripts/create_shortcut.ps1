$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\axelh\Desktop\Jugar RPS Retro.lnk")
$Shortcut.TargetPath = "C:\Users\axelh\Desktop\ggg\scripts\launch_game.bat"
$Shortcut.WorkingDirectory = "C:\Users\axelh\Desktop\ggg"
$Shortcut.IconLocation = "C:\Users\axelh\Desktop\ggg\www\favicon.ico"
$Shortcut.Save()
Write-Host "Acceso directo creado correctamente en el Escritorio."
