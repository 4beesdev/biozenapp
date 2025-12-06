package com.example.app.todo;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;


@RestController
@RequestMapping("/api/todos")
public class TodoController {
private final TodoRepository repo;
public TodoController(TodoRepository repo) { this.repo = repo; }


@GetMapping
public List<Todo> all() { return repo.findAll(); }


@PostMapping
public ResponseEntity<Todo> create(@RequestBody Todo body) {
Todo saved = repo.save(new Todo(body.getText()));
return ResponseEntity.created(URI.create("/api/todos/" + saved.getId())).body(saved);
}


@PutMapping("/{id}")
public ResponseEntity<Todo> update(@PathVariable Long id, @RequestBody Todo body) {
return repo.findById(id)
.map(t -> {
t.setText(body.getText());
t.setDone(body.isDone());
return ResponseEntity.ok(repo.save(t));
})
.orElseGet(() -> ResponseEntity.notFound().build());
}


@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
if (repo.existsById(id)) { repo.deleteById(id); return ResponseEntity.noContent().build(); }
return ResponseEntity.notFound().build();
}
}