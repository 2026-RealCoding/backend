package com.inspire12.backend.service;

import com.inspire12.backend.dto.OrderRequest;
import com.inspire12.backend.dto.OrderResponse;
import com.inspire12.backend.entity.OrderEntity;
import com.inspire12.backend.exception.InvalidRequestException;
import com.inspire12.backend.exception.UserNotFoundException;
import com.inspire12.backend.repository.OrderRepository;
import com.inspire12.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 주문 Service: 비즈니스 로직 담당
//
// 비즈니스 요구사항에서 발생하는 질문들:
//   Q. "구매 시 유저 체크는 어떤 걸 말하는 거죠?"
//   A. 두 가지 의미:
//      1. 인증(Authentication): JWT 토큰으로 로그인 여부 확인 → Interceptor 가 담당
//      2. 유효성(Validation): 해당 유저가 실제 존재하는지 확인 → Service 에서 담당
//
//   Q. 주문할 때 재고 확인은?
//   A. 네이버 쇼핑 API 는 외부 상품이므로 재고 관리 불가
//      → 현재 단계에서는 생략 (실무에서는 자체 상품 DB 가 있을 때 처리)
@Service
@Transactional(readOnly = true)
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        // 1. 유저 존재 여부 확인 ("유저 체크")
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }

        // 2. 요청 데이터 검증
        if (request.quantity() <= 0) {
            throw new InvalidRequestException("수량은 1 이상이어야 합니다");
        }
        if (request.price() <= 0) {
            throw new InvalidRequestException("가격은 1 이상이어야 합니다");
        }

        // 3. 주문 생성
        OrderEntity entity = new OrderEntity(
                userId,
                request.productId(),
                request.title(),
                request.image(),
                request.price(),
                request.quantity()
        );
        OrderEntity saved = orderRepository.save(entity);

        log.info("주문 생성 완료 - orderId: {}, userId: {}, productId: {}, quantity: {}",
                saved.getId(), userId, request.productId(), request.quantity());

        return toDto(saved);
    }

    public Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable) {
        // 유저 존재 여부 확인
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }

        Page<OrderResponse> orders = orderRepository
                .findByUserIdOrderByOrderedAtDesc(userId, pageable)
                .map(this::toDto);

        log.info("주문 목록 조회 - userId: {}, 페이지: {}, 총 {}건",
                userId, pageable.getPageNumber(), orders.getTotalElements());

        return orders;
    }

    private OrderResponse toDto(OrderEntity entity) {
        return new OrderResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getTitle(),
                entity.getImage(),
                entity.getPrice(),
                entity.getQuantity(),
                entity.getPrice() * entity.getQuantity(),
                entity.getOrderedAt()
        );
    }
}
