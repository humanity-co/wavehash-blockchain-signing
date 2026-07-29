# Tests CMakeLists.txt
add_executable(test_grid_2d grid/test_grid_2d.cpp)
target_link_libraries(test_grid_2d PRIVATE wavecrypt wavecrypt_core)


