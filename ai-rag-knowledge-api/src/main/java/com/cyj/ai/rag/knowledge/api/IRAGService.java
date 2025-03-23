package com.cyj.ai.rag.knowledge.api;

import com.cyj.ai.rag.knowledge.api.response.Response;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.23
 **/
public interface IRAGService {

    Response<List<String>> listRags();

    Response<Void> uploadFile(String ragName, List<MultipartFile> files);
}