package com.inspire12.backend.service;

import com.inspire12.backend.dto.Order;
import com.inspire12.backend.entity.OrderEntity;
import com.inspire12.backend.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order createOrder(Long userId, Long productId, String productName, Integer price, Integer quantity) {
        log.info("주문 생성 - userId: {}, product: {}, price: {}, qty: {}", userId, productName, price, quantity);
        OrderEntity entity = new OrderEntity(userId, productId, productName, price, quantity);
        OrderEntity saved = orderRepository.save(entity);
        log.info("주문 생성 완료 - orderId: {}", saved.getId());
        return toDto(saved);
    }

    public List<Order> getMyOrders(Long userId) {
        log.info("주문 목록 조회 - userId: {}", userId);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private Order toDto(OrderEntity entity) {
        return new Order(
                entity.getId(),
                entity.getUserId(),
                entity.getProductId(),
                entity.getProductName(),
                entity.getPrice(),
                entity.getQuantity(),
                entity.getCreatedAt().toString()
        );
    }
}
