// web/ResourceController.java
package com.uvg.wellnessapp.web;

import com.uvg.wellnessapp.domain.ResourceItem;
import com.uvg.wellnessapp.repository.ResourceRepository;
import com.uvg.wellnessapp.security.JwtService;
import com.uvg.wellnessapp.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

  private final ResourceRepository repo;
  private final FileStorageService storage;
  private final JwtService jwt;

  // Público (APPROVED)
  @GetMapping("/public")
  public List<ResourceItem> listPublic() {
    return repo.findByStatusOrderByCreatedAtDesc("APPROVED");
  }

  // Admin (todo)
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<ResourceItem> listAll() {
    return repo.findAllByOrderByCreatedAtDesc();
  }

  @PostMapping(consumes = "multipart/form-data")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> create(
      @RequestPart("title") String title,
      @RequestPart(value = "description", required = false) String description,
      @RequestPart(value = "category", required = false) String category,
      @RequestPart(value = "file", required = false) MultipartFile file,
      @RequestHeader("Authorization") String auth
  ) throws Exception {
    var stored = storage.store(file); // puede ser null
    Long userId = jwt.getUserId(auth.replace("Bearer ",""));

    var r = new ResourceItem();
    r.setTitle(title);
    r.setDescription(description);
    r.setCategory(category);
    if (stored != null) { r.setFileKey(stored.key()); r.setFileUrl(stored.url()); }
    r.setCreatedBy(userId);
    r.setStatus("APPROVED"); // ← requerido por V4 (NOT NULL + check)
    return ResponseEntity.status(201).body(repo.save(r));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> delete(@PathVariable Long id) {
    return repo.findById(id).map(r -> {
      if (r.getFileKey() != null) { storage.delete(r.getFileKey()); }
      repo.delete(r);
      return ResponseEntity.noContent().build();
    }).orElse(ResponseEntity.notFound().build());
  }
}
