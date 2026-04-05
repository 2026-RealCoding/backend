package com.inspire12.backend.dto;

// 주문 생성 요청 DTO
//
// 프론트엔드에서 보내는 데이터:
//   - 상품 검색 결과(ShoppingItem)에서 선택한 상품 정보
//   - 구매 수량
//
// userId 는 DTO 에 포함하지 않음
//   → JWT 토큰에서 추출 (클라이언트가 보낸 userId 를 믿지 않음)
//   → "유저 체크" = JWT 인증으로 본인 확인
public record OrderRequest(
        Long productId,
        String title,
        String image,
        int price,
        int quantity
) {
}
