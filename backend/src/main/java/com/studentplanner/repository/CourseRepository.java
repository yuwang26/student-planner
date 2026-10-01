package com.studentplanner.repository;

import com.studentplanner.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByUserIdOrderByNameAsc(Long userId);
    Optional<Course> findByIdAndUserId(Long id, Long userId);
}
