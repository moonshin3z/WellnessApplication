package com.uvg.wellnessapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {
  private final Path root;

  public FileStorageService(@Value("${app.storage.uploadDir}") String uploadDir) throws Exception {
    this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(this.root);
  }

  public record Stored(String key, String url) {}

  public Stored store(MultipartFile file) throws Exception {
    if (file == null || file.isEmpty()) return null;
    String ext = Optional.ofNullable(file.getOriginalFilename())
        .filter(n -> n.contains("."))
        .map(n -> n.substring(n.lastIndexOf('.')))
        .orElse("");
    String key = UUID.randomUUID() + ext;
    Path dest = root.resolve(key);
    Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
    return new Stored(key, "/files/" + key);
  }

  public void delete(String key) {
    if (key == null) return;
    try { Files.deleteIfExists(root.resolve(key)); } catch (Exception ignored) {}
  }
}
