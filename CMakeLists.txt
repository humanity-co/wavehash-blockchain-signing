cmake_minimum_required(VERSION 3.20)
project(WaveCrypt VERSION 2.0.0 LANGUAGES CXX)

if(POLICY CMP0135)
  cmake_policy(SET CMP0135 NEW)
endif()

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags for strict warnings and optimization
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang|AppleClang|GNU")
    set(WAVECRYPT_WARNING_FLAGS 
        -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion -Werror)
    # Strictly NO fast-math. We need bit-exact determinism.
    set(WAVECRYPT_OPT_FLAGS -O3 -march=native -flto)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "MSVC")
    set(WAVECRYPT_WARNING_FLAGS /W4 /WX)
    set(WAVECRYPT_OPT_FLAGS /O2 /GL)
endif()

add_library(wavecrypt_core INTERFACE)
target_include_directories(wavecrypt_core INTERFACE
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
target_compile_options(wavecrypt_core INTERFACE ${WAVECRYPT_WARNING_FLAGS})

# Add Subdirectories
add_subdirectory(src)
enable_testing()
add_subdirectory(tests)
add_subdirectory(benchmark)
add_subdirectory(examples)
add_subdirectory(tools)
