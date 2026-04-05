package com.inspire12.backend.dto;

import java.time.LocalDateTime;

// 주문 응답 DTO
//
// Entity 를 그대로 노출하지 않는 이유:
//   1. Entity 변경이 API 응답에 영향을 주지 않도록 분리
//   2. 프론트엔드에 필요한 필드만 선택적으로 노출
//   3. totalPrice 같은 계산 필드를 추가하기 용이
public record OrderResponse(
        Long id,
        Long productId,
        String title,
        String image,
        int price,
        int quantity,
        int totalPrice,
        LocalDateTime orderedAt
) {
}
