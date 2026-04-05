package com.inspire12.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// 주문 Entity: 유저가 상품을 구매한 기록
//
// 비즈니스 요구사항 → 테이블 설계 사고 과정:
//   "유저가 상품을 구매한다" →
//     - 누가? → userId (어떤 유저인지)
//     - 무엇을? → productId, title, image, price (어떤 상품인지)
//     - 얼마나? → quantity (몇 개)
//     - 언제? → orderedAt (주문 시각)
//
// 포인트: 상품 정보(title, price 등)를 주문 시점에 복사해서 저장
//   → 네이버 API 의 상품 정보는 언제든 바뀔 수 있으므로
//   → 주문 당시의 정보를 스냅샷으로 보관해야 함
@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long productId;

    private String title;

    private String image;

    private int price;

    private int quantity;

    private LocalDateTime orderedAt;

    protected OrderEntity() {
    }

    public OrderEntity(Long userId, Long productId, String title, String image, int price, int quantity) {
        this.userId = userId;
        this.productId = productId;
        this.title = title;
        this.image = image;
        this.price = price;
        this.quantity = quantity;
        this.orderedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getProductId() {
        return productId;
    }

    public String getTitle() {
        return title;
    }

    public String getImage() {
        return image;
    }

    public int getPrice() {
        return price;
    }

    public int getQuantity() {
        return quantity;
    }

    public LocalDateTime getOrderedAt() {
        return orderedAt;
    }
}
