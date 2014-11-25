@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\anfis\bin\anfis" %*
) ELSE (
  node  "%~dp0\node_modules\anfis\bin\anfis" %*
)