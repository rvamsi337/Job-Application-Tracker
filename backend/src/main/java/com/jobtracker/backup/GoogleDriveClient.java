package com.jobtracker.backup;

public interface GoogleDriveClient {

    void upload(String fileName, String contentType, byte[] content);
}
