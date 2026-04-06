package com.inspire12.backend.dto;

public record CreateOrderRequest(
        Long productId,
        String productName,
        Integer price,
        Integer quantity
) {}
