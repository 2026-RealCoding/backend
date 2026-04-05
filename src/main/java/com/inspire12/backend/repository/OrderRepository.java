package com.inspire12.backend.repository;

import com.inspire12.backend.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// 주문 Repository: UserRepository 와 동일한 패턴
//
// 비즈니스 요구사항 → 쿼리 메서드 매핑:
//   "내 주문 목록을 보고 싶다" → findByUserId(Long userId, Pageable)
//   → SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC LIMIT ? OFFSET ?
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    Page<OrderEntity> findByUserIdOrderByOrderedAtDesc(Long userId, Pageable pageable);
}
