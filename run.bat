@echo off
echo ========================================================
echo Starting CNG Navigator Application...
echo ========================================================

REM Find Java
if defined JAVA_HOME (
    set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
    if exist "C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.4\jbr\bin\java.exe" (
        set "JAVA_EXE=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.4\jbr\bin\java.exe"
        set "JAVA_HOME=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.4\jbr"
    ) else (
        set "JAVA_EXE=java"
    )
)

REM Find Maven
if exist "C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.4\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" (
    set "MVN_CMD=C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.4\plugins\maven-plugin\lib\maven3\bin\mvn.cmd"
) else (
    set "MVN_CMD=mvn"
)

echo Using Java: %JAVA_EXE%
echo Using Maven: %MVN_CMD%
echo.

if exist target attrib -r target\*.* /s >nul 2>nul

"%MVN_CMD%" -s settings.xml spring-boot:run
pause
