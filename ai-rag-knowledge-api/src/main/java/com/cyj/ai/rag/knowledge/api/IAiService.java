package com.cyj.ai.rag.knowledge.api;

import org.springframework.ai.chat.ChatResponse;
import reactor.core.publisher.Flux;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.19
 **/
public interface IAiService {

    ChatResponse generate(String model, String message);

    Flux<ChatResponse> generateStream(String model, String message);
}