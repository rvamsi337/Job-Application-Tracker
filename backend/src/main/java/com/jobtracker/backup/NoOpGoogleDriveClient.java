package com.jobtracker.backup;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.backup", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoOpGoogleDriveClient implements GoogleDriveClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoOpGoogleDriveClient.class);

    @Override
    public void upload(String fileName, String contentType, byte[] content) {
        LOGGER.info("Google Drive backup disabled, skipping upload for {}", fileName);
    }
}
