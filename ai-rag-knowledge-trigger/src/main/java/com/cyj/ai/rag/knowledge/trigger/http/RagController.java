package com.cyj.ai.rag.knowledge.trigger.http;

import com.cyj.ai.rag.knowledge.api.IRAGService;
import com.cyj.ai.rag.knowledge.api.response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RList;
import org.redisson.api.RedissonClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.PgVectorStore;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.23
 **/
@Slf4j
@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/rag/")
@RequiredArgsConstructor
public class RagController implements IRAGService {

    private final PgVectorStore pgVectorStore;
    private final TokenTextSplitter tokenTextSplitter;
    private final RedissonClient redissonClient;

    @GetMapping("listRags")
    @Override
    public Response<List<String>> listRags() {
        final RList<String> rags = redissonClient.getList("rags");
        return Response.success(rags);
    }

    @PostMapping(value = "upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Override
    public Response<Void> uploadFile(@RequestParam String ragName, @RequestParam("file") List<MultipartFile> files) {

        files.forEach(file -> {
            final TikaDocumentReader reader = new TikaDocumentReader(file.getResource());
            final List<Document> documents = reader.get();
            final List<Document> documentsTextSplit = tokenTextSplitter.apply(documents);
            documentsTextSplit.forEach(d -> d.getMetadata().put("knowledge", ragName));
            pgVectorStore.accept(documentsTextSplit);
            final RList<String> ragListExist = redissonClient.getList("rags");
            if(!ragListExist.contains(ragName)){
                ragListExist.add(ragName);
            }
        });
        return Response.success();
    }
}