package com.inspire12.backend.controller;

import com.inspire12.backend.dto.OrderRequest;
import com.inspire12.backend.dto.OrderResponse;
import com.inspire12.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

// 주문 API: 프론트엔드 연동을 위한 엔드포인트
//
// 프론트엔드 화면 흐름 → API 매핑:
//   1. 회원가입  → POST /users         (기존 API 재사용)
//   2. 로그인    → POST /users/login    (기존 API 재사용 → JWT 토큰 발급)
//   3. 상품 검색 → GET  /shop/search    (기존 API 재사용, JWT 필요)
//   4. 구매      → POST /orders         (신규, JWT 필요)
//   5. 주문 목록 → GET  /orders         (신규, JWT 필요)
//
// 모든 주문 API 는 JWT 인증 필요 (WebMvcConfig 에서 /orders/** 등록)
// userId 는 JWT 에서 추출 → @RequestAttribute("userId") 로 주입
@Tag(name = "Order", description = "주문 API")
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "주문 생성 (구매)", description = "상품을 구매합니다. JWT 토큰으로 유저를 확인합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "주문 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestAttribute("userId") Long userId,
            @RequestBody OrderRequest request) {
        OrderResponse created = orderService.createOrder(userId, request);
        return ResponseEntity
                .created(URI.create("/orders/" + created.id()))
                .body(created);
    }

    @Operation(summary = "내 주문 목록 조회", description = "현재 로그인한 유저의 주문 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping
    public Page<OrderResponse> getMyOrders(
            @RequestAttribute("userId") Long userId,
            Pageable pageable) {
        return orderService.getOrdersByUserId(userId, pageable);
    }
}
