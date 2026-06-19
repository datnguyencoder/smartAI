package com.smartmart.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "forecastTaskExecutor")
    public Executor forecastTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(5);
        executor.setThreadNamePrefix("forecast-");
        executor.setRejectedExecutionHandler((r, ex) -> {
            throw new java.util.concurrent.RejectedExecutionException(
                    "Forecast executor queue full — training job rejected");
        });
        executor.initialize();
        return executor;
    }
}
