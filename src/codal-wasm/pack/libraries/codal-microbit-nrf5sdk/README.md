# What is this

A repo containing the files that CODAL requires of the nRF5SDK for our BLE implementation.

***THIS IS NOT A MIRROR OF THE Nordic SDK. It will probably be missing many files. We are intentionally keeping this lean.***

## Modifying this library - Currently broken see [issue #3](https://github.com/microbit-foundation/codal-microbit-nrf5sdk/issues/3)

If a new header or source file from the SDK is required for future CODAL micro:bit development:

1. Download the nRF5SDK from the [Nordic website](https://www.nordicsemi.com/Software-and-tools/Software/nRF5-SDK/Download#infotabs). Unpack it so that the SDK is in a folder `../nRF5SDK/` compared to the root of this repository. This will typically be `codal/libraries/nRF5SDK`

2. Add it to CMakeLists.txt

`APPEND INCLUDE_SDK_DIRS "${SDK_DIRECTORY}/nRF5SDK/{directory}"`

`APPEND SOURCE_FILES "${SDK_DIRECTORY}/nRFSDK/{path to file}.c`

3. Run `cmake . -D REGENERATE=True` to update the `./nRF5SDK` folder in this repository

4. Commit, push, create a PR!

## Code of Conduct

Trust, partnership, simplicity and passion are our core values we live and breathe in our daily work life and within our projects. Our open-source projects are no exception. We have an active community which spans the globe and we welcome and encourage participation and contributions to our projects by everyone. We work to foster a positive, open, inclusive and supportive environment and trust that our community respects the micro:bit code of conduct. Please see our [code of conduct](https://microbit.org/safeguarding/) which outlines our expectations for all those that participate in our community and details on how to report any concerns and what would happen should breaches occur.
