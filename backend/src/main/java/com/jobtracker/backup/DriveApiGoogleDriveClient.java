package com.jobtracker.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.jobtracker.config.AppProperties;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.backup", name = "enabled", havingValue = "true")
public class DriveApiGoogleDriveClient implements GoogleDriveClient {

    private static final String DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    private final GoogleCredentials credentials;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String folderId;

    public DriveApiGoogleDriveClient(AppProperties properties) throws IOException {
        byte[] credentialsBytes = properties.getBackup().getServiceAccountJson().getBytes(StandardCharsets.UTF_8);
        this.credentials = GoogleCredentials.fromStream(new ByteArrayInputStream(credentialsBytes))
                .createScoped(List.of("https://www.googleapis.com/auth/drive.file"));
        this.folderId = properties.getBackup().getFolderId();
    }

    @Override
    public void upload(String fileName, String contentType, byte[] content) {
        try {
            String boundary = "job-tracker-" + Instant.now().toEpochMilli();
            String metadata = objectMapper.writeValueAsString(Map.of(
                    "name", fileName,
                    "parents", List.of(folderId)
            ));
            byte[] requestBody = buildMultipartBody(boundary, metadata, contentType, content);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(DRIVE_UPLOAD_URL))
                    .header("Authorization", "Bearer " + accessToken())
                    .header("Content-Type", "multipart/related; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("Drive upload failed: " + response.body());
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to upload backup to Google Drive", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to upload backup to Google Drive", exception);
        }
    }

    private String accessToken() throws IOException {
        credentials.refreshIfExpired();
        AccessToken accessToken = credentials.getAccessToken();
        if (accessToken == null || accessToken.getTokenValue() == null) {
            throw new IllegalStateException("Google Drive access token is unavailable");
        }
        return accessToken.getTokenValue();
    }

    private byte[] buildMultipartBody(String boundary, String metadata, String contentType, byte[] content) {
        String firstPart = "--" + boundary + "\r\n"
                + "Content-Type: application/json; charset=UTF-8\r\n\r\n"
                + metadata + "\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Type: " + contentType + "\r\n\r\n";
        String closing = "\r\n--" + boundary + "--";
        byte[] prefix = firstPart.getBytes(StandardCharsets.UTF_8);
        byte[] suffix = closing.getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[prefix.length + content.length + suffix.length];
        System.arraycopy(prefix, 0, body, 0, prefix.length);
        System.arraycopy(content, 0, body, prefix.length, content.length);
        System.arraycopy(suffix, 0, body, prefix.length + content.length, suffix.length);
        return body;
    }
}
