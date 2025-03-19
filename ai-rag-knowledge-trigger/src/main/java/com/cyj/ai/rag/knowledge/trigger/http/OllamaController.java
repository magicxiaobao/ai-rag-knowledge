package com.cyj.ai.rag.knowledge.trigger.http;

import com.cyj.ai.rag.knowledge.api.IAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.19
 **/
@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/ollama/")
@RequiredArgsConstructor
public class OllamaController implements IAiService {

    private final OllamaChatClient ollamaChatClient;

    @GetMapping("generate")
    @Override
    public ChatResponse generate(@RequestParam String model, @RequestParam String message) {
        return ollamaChatClient.call(new Prompt(message, OllamaOptions.create().withModel(model)));
    }

    @GetMapping("generate_stream")
    @Override
    public Flux<ChatResponse> generateStream(String model, String message) {
        return ollamaChatClient.stream(new Prompt(message, OllamaOptions.create().withModel(model)));
    }
}