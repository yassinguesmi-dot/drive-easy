package tn.driveeasy.gateway.filter;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        long startedAt = System.nanoTime();
        log.info("Request {} {}", request.getMethod(), request.getURI().getPath());
        return chain.filter(exchange)
                .doFinally(signal -> log.info("Response {} {} status={} durationMs={} signal={}",
                        request.getMethod(), request.getURI().getPath(),
                        exchange.getResponse().getStatusCode(),
                        Duration.ofNanos(System.nanoTime() - startedAt).toMillis(), signal));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
