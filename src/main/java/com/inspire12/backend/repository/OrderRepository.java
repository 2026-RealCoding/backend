package com.inspire12.backend.repository;

import com.inspire12.backend.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    // userId로 주문 목록 조회 — 최신순 정렬
    // Spring Data JPA가 메서드 이름으로 쿼리 자동 생성:
    // SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
}
