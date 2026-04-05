-- 초기 데이터 삽입
-- 기존 MemoryUserRepository 생성자에서 넣던 데이터를 SQL 로 대체
--
-- spring.sql.init.mode=always 설정 시 매번 실행됨
-- INSERT OR IGNORE: 이미 데이터가 있으면 무시 (SQLite 문법)
INSERT OR IGNORE INTO users (id, name, email) VALUES (1, '홍길동', 'hong@example.com');
INSERT OR IGNORE INTO users (id, name, email) VALUES (2, '김철수', 'kim@example.com');
INSERT OR IGNORE INTO users (id, name, email) VALUES (3, '이영희', 'lee@example.com');

-- 주문 초기 데이터 (Step 17: 프론트엔드 연동)
INSERT OR IGNORE INTO orders (id, user_id, product_id, title, image, price, quantity, ordered_at)
VALUES (1, 1, 12345, 'Apple 맥북 프로 14', 'https://example.com/macbook.jpg', 2590000, 1, '2026-03-01 10:00:00');
INSERT OR IGNORE INTO orders (id, user_id, product_id, title, image, price, quantity, ordered_at)
VALUES (2, 1, 67890, 'Apple 에어팟 프로 2', 'https://example.com/airpods.jpg', 359000, 2, '2026-03-05 14:30:00');
