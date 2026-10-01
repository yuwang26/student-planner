package com.studentplanner.repository;

import com.studentplanner.model.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HomeworkRepository extends JpaRepository<Homework, Long> {

    @Query("SELECT h FROM Homework h JOIN h.course c WHERE c.user.id = :userId ORDER BY h.dueDate ASC")
    List<Homework> findByUserIdOrderByDueDateAsc(@Param("userId") Long userId);

    @Query("SELECT h FROM Homework h JOIN h.course c WHERE c.user.id = :userId AND h.dueDate <= :before ORDER BY h.dueDate ASC")
    List<Homework> findByUserIdAndDueDateBefore(@Param("userId") Long userId, @Param("before") LocalDate before);

    @Query("SELECT h FROM Homework h JOIN h.course c WHERE c.id = :courseId AND c.user.id = :userId ORDER BY h.dueDate ASC")
    List<Homework> findByCourseIdAndUserId(@Param("courseId") Long courseId, @Param("userId") Long userId);

    @Query("SELECT h FROM Homework h JOIN h.course c WHERE h.id = :id AND c.user.id = :userId")
    Optional<Homework> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
