add_library(wavecrypt STATIC
    core.cpp
)

target_link_libraries(wavecrypt PUBLIC wavecrypt_core)
target_compile_options(wavecrypt PRIVATE ${WAVECRYPT_OPT_FLAGS})
