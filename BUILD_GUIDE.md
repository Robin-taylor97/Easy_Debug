# Build Guide - Easy Debug

This document provides comprehensive instructions for building Easy Debug across all supported platforms.

## Prerequisites

### Common Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: Latest version
- **Git**: For version control

### Platform-Specific Requirements

#### Windows
- **Visual Studio Build Tools**: Required for native dependencies
- **Python**: 3.x for node-gyp
- **Windows SDK**: Latest version
- **NSIS**: For installer creation (automatically handled by electron-builder)

#### macOS
- **Xcode**: Latest version with command line tools
- **Apple Developer Account**: For code signing and notarization
- **Certificates**: Developer ID Application and Installer certificates

#### Linux
- **Build essentials**: gcc, g++, make
- **Development libraries**: libgtk-3-dev, libnss3-dev, libatk-bridge2.0-dev, libx11-xcb-dev, libxss1, libasound2-dev

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/easy-debug-team/easy-debug.git
   cd easy-debug
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run webpack build**:
   ```bash
   npm run webpack:prod
   ```

## Development Build

### Start Development Mode
```bash
npm start          # Start Electron app
npm run dev        # Start with nodemon
npm run webpack:watch  # Watch webpack changes
```

### Development Scripts
- `npm start`: Launch Electron app in development mode
- `npm run dev`: Start with nodemon for auto-restart
- `npm run webpack:watch`: Webpack development build with watch mode
- `npm test`: Run unit tests
- `npm run analyze`: Performance analysis

## Production Builds

### Build for All Platforms
```bash
npm run build
```

This creates distributables for:
- **Windows**: NSIS installer (.exe) + Portable (.exe)
- **macOS**: DMG installer (.dmg) + ZIP archive (.zip)
- **Linux**: AppImage (.AppImage), DEB (.deb), RPM (.rpm), TAR.GZ (.tar.gz)

### Platform-Specific Builds

#### Windows Build
```bash
npm run build:win
```

**Output**:
- `dist/Easy-Debug-Setup-1.0.0.exe` - NSIS installer (x64, ia32)
- `dist/Easy-Debug-1.0.0-Portable.exe` - Portable executable (x64)

**Features**:
- Custom installer with desktop shortcut creation
- Start menu integration
- File associations for .easydebug files
- Uninstaller with user data removal option

#### macOS Build
```bash
npm run build:mac
```

**Output**:
- `dist/Easy-Debug-1.0.0-mac.dmg` - DMG installer (x64, arm64)
- `dist/Easy-Debug-1.0.0-mac.zip` - ZIP archive (universal)

**Features**:
- Code signing with Developer ID
- Notarization for Gatekeeper compatibility
- Custom DMG background and layout
- Hardened runtime entitlements

#### Linux Build
```bash
npm run build:linux
```

**Output**:
- `dist/Easy-Debug-1.0.0.AppImage` - AppImage (x64)
- `dist/Easy-Debug-1.0.0.deb` - Debian package (x64)
- `dist/Easy-Debug-1.0.0.rpm` - RPM package (x64)
- `dist/Easy-Debug-1.0.0.tar.gz` - TAR archive (x64)

**Features**:
- Desktop integration with .desktop file
- System dependencies declaration
- File manager integration
- Package metadata and descriptions

## Build Configuration

### Electron Builder Settings

The build configuration in `package.json` includes:

```json
{
  "build": {
    "appId": "com.easydebug.app",
    "productName": "Easy Debug",
    "compression": "maximum",
    "asar": true,
    "directories": {
      "output": "dist",
      "buildResources": "build"
    }
  }
}
```

### File Inclusion/Exclusion

**Included Files**:
- `main.js` - Electron main process
- `renderer/**/*` - Frontend application
- `terminal/**/*` - Terminal integration
- `config/**/*` - Configuration files
- `assets/**/*` - Icons and images
- `package.json` - Package metadata

**Excluded Files**:
- `tests/**/*` - Test files
- `tools/**/*` - Development tools
- `docs/**/*` - Documentation
- `*.md` - Markdown files
- Build configuration files

### Icons and Assets

Required icon formats:
- **Windows**: `assets/icon.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- **macOS**: `assets/icon.icns` (512x512, 256x256, 128x128, 64x64, 32x32, 16x16)
- **Linux**: `assets/icon.png` (512x512 PNG)

## Code Signing and Distribution

### Windows Code Signing

1. **Obtain Code Signing Certificate**:
   - Purchase from trusted CA (DigiCert, Sectigo, etc.)
   - Or use self-signed certificate for testing

2. **Configure Environment Variables**:
   ```bash
   set CSC_LINK=path/to/certificate.p12
   set CSC_KEY_PASSWORD=certificate_password
   ```

3. **Build with Signing**:
   ```bash
   npm run build:win
   ```

### macOS Code Signing and Notarization

1. **Prerequisites**:
   - Apple Developer Account
   - Developer ID Application certificate
   - App-specific password

2. **Configure Environment Variables**:
   ```bash
   export APPLEID=your-apple-id@example.com
   export APPLEIDPASS=app-specific-password
   export APPLETEAMID=your-team-id
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=certificate_password
   ```

3. **Build with Signing and Notarization**:
   ```bash
   npm run build:mac
   ```

### Linux Package Signing

For DEB and RPM packages:
```bash
# Configure GPG key
export GPG_KEY_ID=your-key-id
export GPG_PASSPHRASE=your-passphrase

# Build signed packages
npm run build:linux
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run webpack:prod
      
      - name: Build Windows
        if: matrix.os == 'windows-latest'
        run: npm run build:win
        
      - name: Build macOS
        if: matrix.os == 'macos-latest'
        run: npm run build:mac
        env:
          APPLEID: ${{ secrets.APPLEID }}
          APPLEIDPASS: ${{ secrets.APPLEIDPASS }}
          APPLETEAMID: ${{ secrets.APPLETEAMID }}
          
      - name: Build Linux
        if: matrix.os == 'ubuntu-latest'
        run: npm run build:linux
```

## Performance Optimization

### Bundle Analysis
```bash
npm run analyze
```

This generates:
- Bundle size reports
- Dependency analysis
- Performance metrics
- Optimization recommendations

### Build Optimization Tips

1. **ASAR Packaging**: Enabled for faster file access
2. **Compression**: Maximum compression for smaller distributables
3. **File Exclusion**: Development files excluded from builds
4. **Asset Optimization**: Icons and images optimized
5. **Code Splitting**: Webpack bundles optimized

## Troubleshooting

### Common Build Issues

#### Windows
- **node-gyp errors**: Install Visual Studio Build Tools
- **Permission errors**: Run as administrator or check antivirus
- **Path too long**: Enable long path support in Windows

#### macOS
- **Code signing errors**: Check certificate validity and keychain access
- **Notarization failures**: Verify Apple ID credentials and team ID
- **Gatekeeper issues**: Ensure proper entitlements configuration

#### Linux
- **Missing dependencies**: Install required development libraries
- **Permission errors**: Check executable permissions and file ownership
- **Desktop integration**: Verify .desktop file associations

### Build Debugging

1. **Verbose Output**:
   ```bash
   DEBUG=electron-builder npm run build
   ```

2. **Clean Build**:
   ```bash
   npm run clean
   npm install
   npm run build
   ```

3. **Individual Platform Testing**:
   ```bash
   npm run pack  # Build without packaging
   ```

## Distribution

### GitHub Releases
- Automatic release creation via electron-builder
- Asset upload to GitHub Releases
- Release notes generation

### Alternative Distribution
- **Microsoft Store**: Windows Store deployment
- **Mac App Store**: Apple App Store submission
- **Snap Store**: Linux Snap package
- **Homebrew**: macOS Homebrew formula

## Security Considerations

1. **Code Signing**: Always sign production builds
2. **Vulnerability Scanning**: Regular dependency audits
3. **ASAR Integrity**: Enable ASAR integrity validation
4. **Update Security**: Secure update mechanism implementation
5. **Sandboxing**: Consider app sandboxing for enhanced security

## Build Artifacts

After successful build, the `dist/` directory contains:

```
dist/
├── win/                    # Windows build artifacts
│   ├── *.exe              # Installers and portable apps
│   └── win-unpacked/      # Unpacked application
├── mac/                    # macOS build artifacts
│   ├── *.dmg              # DMG installers
│   ├── *.zip              # ZIP archives
│   └── mac/               # Unpacked .app bundle
└── linux/                 # Linux build artifacts
    ├── *.AppImage         # AppImage executables
    ├── *.deb              # Debian packages
    ├── *.rpm              # RPM packages
    └── *.tar.gz           # TAR archives
```

## Version Management

Update version in `package.json` before building:
```json
{
  "version": "1.0.0"
}
```

Or use npm version commands:
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

---

This build guide ensures consistent, reliable, and secure distribution of Easy Debug across all supported platforms.