package com.inspire12.backend.controller;

import com.inspire12.backend.dto.CreateOrderRequest;
import com.inspire12.backend.dto.Order;
import com.inspire12.backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

// JwtAuthInterceptor가 /orders/** 요청을 가로채
// 토큰 검증 후 userId를 request attribute로 주입한다.
// @RequestAttribute("userId")로 꺼내서 사용.
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // POST /orders — 주문 생성
    // JWT 인증 필요 (JwtAuthInterceptor가 검증)
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestAttribute("userId") Long userId,
            @RequestBody CreateOrderRequest request) {

        Order created = orderService.createOrder(
                userId,
                request.productId(),
                request.productName(),
                request.price(),
                request.quantity() != null ? request.quantity() : 1
        );

        return ResponseEntity
                .created(URI.create("/orders/" + created.id()))
                .body(created);
    }

    // GET /orders/me — 내 주문 목록
    // JWT 인증 필요 (JwtAuthInterceptor가 검증)
    @GetMapping("/me")
    public List<Order> getMyOrders(@RequestAttribute("userId") Long userId) {
        return orderService.getMyOrders(userId);
    }
}
