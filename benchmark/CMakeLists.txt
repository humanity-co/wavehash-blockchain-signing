# Benchmark CMakeLists.txt
add_executable(bench_grid_2d grid/bench_grid_2d.cpp)
target_link_libraries(bench_grid_2d PRIVATE wavecrypt wavecrypt_core)


