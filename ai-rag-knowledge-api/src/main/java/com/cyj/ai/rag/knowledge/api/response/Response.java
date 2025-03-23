package com.cyj.ai.rag.knowledge.api.response;

/**
 * 功能描述:
 *
 * @author chenyuejun
 * @version 1.0.0
 * @since 2025.03.23
 **/

import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Objects;

@Data
@Accessors(chain = true)
public class Response<T> {

    public static final int SUCCESS = 0;
    public static final int FAIL = 1;

    private int code;

    private String message;

    private T data;

    public static Response<Void> success() {
        return new Response<Void>().setCode(SUCCESS).setMessage("success");
    }

    public static <T> Response<T> success(T data) {
        return new Response<T>().setCode(SUCCESS).setMessage("success").setData(data);
    }

    public static Response<Void> fail(String message) {
        return new Response<Void>().setCode(FAIL).setMessage(Objects.nonNull(message) ? message : "fail");
    }
}