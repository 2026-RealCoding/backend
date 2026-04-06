package com.inspire12.backend.dto;

public record Order(
        Long id,
        Long userId,
        Long productId,
        String productName,
        Integer price,
        Integer quantity,
        String createdAt
) {}
