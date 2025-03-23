package com.cyj.ai.rag.knowledge.test;

import com.alibaba.fastjson.JSON;
import com.cyj.ai.rag.knowledge.Application;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.ollama.OllamaChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.PgVectorStore;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.23
 **/
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@RunWith(SpringRunner.class)
@Slf4j
public class RAGTest {

    @Autowired
    private OllamaChatClient ollamaChatClient;
    @Autowired
    private PgVectorStore pgVectorStore;
    @Autowired
    private TokenTextSplitter tokenTextSplitter;

    @Test
    public void importDocument() {
        final TikaDocumentReader tikaDocumentReader = new TikaDocumentReader("./data/a.txt");
        final List<Document> documents = tikaDocumentReader.get();
        final List<Document> documentSplitList = tokenTextSplitter.apply(documents);
        documentSplitList.forEach(doc -> doc.getMetadata().put("knowledge", "知识库名称"));
        pgVectorStore.accept(documentSplitList);
    }

    @Test
    public void testAskQuestion() {
        String message = "方超，今年几岁了";
        String SYSTEM_PROMPT = """
                Use the information from the DOCUMENTS section to provide accurate answers but act as if you knew this information innately.
                If unsure, simply state that you don't know.
                Another thing you need to note is that your reply must be in Chinese!
                DOCUMENTS:
                    {documents}
                """;
        // 先从向量数据库搜索
        final SearchRequest searchRequest = SearchRequest.defaults().withQuery(message)
                .withTopK(5)
                .withFilterExpression("knowledge=='知识库名称'");
        final List<Document> searchResults = pgVectorStore.similaritySearch(searchRequest);
        final String resultStrings = searchResults.stream().map(Document::getContent).collect(Collectors.joining());
        final Message rawMessage = new SystemPromptTemplate(SYSTEM_PROMPT).createMessage(Map.of("documents", resultStrings));
        final List<Message> messages = List.of(new UserMessage(message), rawMessage);
        final Prompt prompt = new Prompt(messages, OllamaOptions.create().withModel("deepseek-r1:1.5b"));
        final ChatResponse chatResponse = ollamaChatClient.call(prompt);
        log.info("chatResponse: {}", JSON.toJSONString(chatResponse));
    }
}